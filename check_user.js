const { db } = require('./config/firebase');

async function checkUser() {
    try {
        const usersCol = db.collection('users');
        const snapshot = await usersCol.where('email', '==', 'bharathkumar21cse@gmail.com').get();
        
        if (snapshot.empty) {
            console.log('User not found in DB.');
        } else {
            snapshot.forEach(doc => {
                console.log('User ID:', doc.id);
                console.log('User Data:', doc.data());
            });
            
            // Fix the role
            const userDoc = snapshot.docs[0];
            if (userDoc.data().role !== 'technician') {
                console.log('Updating role to technician...');
                await usersCol.doc(userDoc.id).update({ role: 'technician' });
                console.log('Role updated successfully.');
            } else {
                console.log('User already has technician role.');
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkUser();
