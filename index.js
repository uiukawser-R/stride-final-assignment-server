require('dotenv').config()
const express = require("express")
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const port = process.env.PORT;

app.use(cors());
app.use(express.json());



function createToken(user) {
    const token = jwt.sign(
        {
            email: user.email
        },
        'secret',
        {
            expiresIn: '1d'
        }
    );
    return token;
}


function verifyToken(req, res, next) {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, "secret");
    if (!verify?.email) {
      return res.send("You are not authorized");
    }
    req.user = verify.email;
    next();
  }


  const uri = process.env.DATABASE_URL;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();



        const eventDB = client.db("eventDB");
        const userDB = client.db("userDB");
        const eventsCollection = eventDB.collection("eventsCollection");
        const usersCollection = userDB.collection("usersCollection");


        app.get("/events", async (req, res) => {
            const eventData = eventsCollection.find();
            const result = await eventData.toArray();
            res.send(result);
        })


        app.post("/events",verifyToken, async (req, res) => {
            const eventsData = req.body;
            const result = await eventsCollection.insertOne(eventsData);
            res.send(result);
        })

       
        app.get("/events/:id", async (req, res) => {
            const id = req.params.id;
            const eventData = await eventsCollection.findOne({ _id: new ObjectId(id) });
            res.send(eventData);
        })
        app.patch("/events/:id",verifyToken, async (req, res) => {
            const id = req.params.id;
            const updateData = req.body;
            const eventData = await eventsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );
            res.send(eventData);
        })
        app.delete("/events/:id", async (req, res) => {
            const id = req.params.id;
            const result = await eventsCollection.deleteOne(
                { _id: new ObjectId(id) },
            );
            res.send(result);
        })




        app.post("/users", async (req, res) => {
            const user = req.body;
            const token=createToken(user)
            // console.log(token);
            const existingUser = await usersCollection.findOne({ email: user.email });
            if (existingUser) {
                return res.json({ 
                    message: "Login success" ,
                    token
                });
            }

            const result = await usersCollection.insertOne(user);
            res.json(result);
        })

        app.get("/users/get/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            await usersCollection.findOne({ _id: new ObjectId(id) });
            res.send(token);
        });


        // app.get("/users/get/:id", async (req, res) => {
        //     const { id } = req.params;
        //     if (!ObjectId.isValid(id)) {
        //         return res.status(400).send("Invalid ID format");
        //     }
        //     const result = await usersCollection.findOne({ _id: new ObjectId(id) });
        //     if (!result) {
        //         return res.status(404).send("User not found");
        //     }
        //     res.send(result);
        // });


        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const result = await usersCollection.findOne({ email });
            res.send(result);
        })

        app.patch("/users/:email", async (req, res) => {
            const email = req.params.email;
            const userData = req.body;
            const result = await usersCollection.updateOne(
                { email },
                { $set: userData },
                { upsert: true }
            );
            res.send(result);
        });



    } finally {

    }
}
run().catch(console.dir);












app.get("/", (req, res) => {
    res.send("Route is working");
})


app.listen(port, (req, res) => {
    console.log("App is listening on port: ", port);
})



