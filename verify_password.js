const { db } = require('./config/firebase');
const bcrypt = require('bcryptjs');

async function checkPass() {
    try {
        const usersCol = db.collection('users');
        const snapshot = await usersCol.where('email', '==', 'bharathkumar21cse@gmail.com').get();
        if (snapshot.empty) {
            console.log("User not found");
            process.exit(1);
        }
        
        const userDoc = snapshot.docs[0];
        const user = userDoc.data();
        console.log("Found user, checking password...");
        
        const variants = ['Bharath123', 'Bharath123I', 'Bharath123!'];
        
        let found = false;
        for (const pass of variants) {
            if (await bcrypt.compare(pass, user.password)) {
                console.log("Password is: " + pass);
                found = true;
                break;
            }
        }
        
        if (!found) {
            console.log("None of the common variants matched.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

checkPass();
