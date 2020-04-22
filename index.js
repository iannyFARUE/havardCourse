const functions = require('firebase-functions')
const admin = require('firebase-admin')


admin.initializeApp()


exports.sendNotification = functions.firestore
    .document('group/{groupId1}/{messages}/{message}')
    .onCreate((snap, context) => {
        console.log('----------------start function--------------------')

        const doc = snap.data()
        console.log(doc)

        const idFrom = doc.from
        console.log(`idFrom : ${idFrom.id}`);

        const idTo = doc.to
        console.log(`idTo : ${idTo.id}`);
        const contentMessage = doc.message
        console.log(`content message : ${contentMessage}`)

        // Get push token user to (receive)
        admin
            .firestore()
            .collection('group')
            .where('id', '==', idTo.id)
            .get()
            .then(querySnapshot => {
                console.log(`querysnapshot is ${querySnapshot}`);


                querySnapshot.forEach(groupTo => {
                    console.log(`Found user to: ${groupTo.data().name}`)


                    groupTo.ref.collection('members').get().then(querySnapshot1 => {

                        querySnapshot1.forEach(member => {

                            if (member.data().id != idFrom.id) {
                                // Get info user from (sent)
                                console.log(`found member : ${member.data().pushToken}`)

                                admin
                                    .firestore()
                                    .collection('users')
                                    .where('email', '==', idFrom.id)
                                    .get()
                                    .then(querySnapshot2 => {
                                        querySnapshot2.forEach(userFrom => {
                                            console.log(`Found user from: ${userFrom.data().email}`)
                                            const payload = {
                                                notification: {
                                                    title: `You have a message from "${userFrom.data().email}"`,
                                                    body: contentMessage,
                                                    badge: '1',
                                                    sound: 'default'
                                                },
                                                data: {
                                                    groupId: groupTo.data().id,
                                                }

                                            }
                                            // console.log(group);

                                            // Let push to the target device
                                            admin
                                                .messaging()
                                                .sendToDevice(member.data().pushToken, payload)
                                                .then(response => {
                                                    console.log('Successfully sent message:', response)
                                                })
                                                .catch(error => {
                                                    console.log('Error sending message:', error)
                                                })
                                        })
                                    })
                            } else {
                                console.log('Can not find pushToken target user')
                            }


                        })
                    })


                })
            })
        return null
        console.log(`Code execution ended`);

    })