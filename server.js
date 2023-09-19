import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

// app config
const app = express();
const port = process.env.PORT || 9000;


const pusher = new Pusher({
    appId: "1673067",
    key: "fa416ff4bced976cd142",
    secret: "e559c2c3d5abd84a70d5",
    cluster: "ap2",
    useTLS: true
  });

// DB config
const connection_url = 'mongodb+srv://admin:WEYvyh7u6RCNDcH6@cluster0.axkc9dl.mongodb.net/whatsappdb?retryWrites=true&w=majority';
mongoose.connect(connection_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Middleware to parse JSON requests
app.use(express.json());
app.use(cors());

// Db config
const db = mongoose.connection
db.once('open', ()=> {
    console.log("DB connected");

const msgCollection = db.collection("messagecontents");
const changeStream = msgCollection.watch();

changeStream.on("change", (change) => {
    console.log("change happened",change);

    if (change.operationType === 'insert') {
        const messageDetails = change.fullDocument;
        pusher.trigger("messages", "inserted",
        {
            name: messageDetails.name,
            message: messageDetails.message,

        }
        );
    } else {
        console.log('Error triggering pusher');
    }
 });
});


// api routes
app.get('/', (req, res) => res.status(200).send('hello world'));

app.get('/messages/sync', async (req, res) => {
    try {
        const data = await Messages.find();
        res.status(200).json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});
app.post('/messages/new', async (req, res) => {
    try {
        const dbMessage = req.body;
        const message = await Messages.create(dbMessage);
        res.status(201).json(message);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

// listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));
