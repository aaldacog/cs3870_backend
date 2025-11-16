import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

// Server configuration
const PORT = process.env.PORT ?? 8081;
const HOST = process.env.HOST ?? "0.0.0.0";

// Create Express app
const app = express();
// Middleware
app.use(cors());
app.use(express.json()); // replaces body-parser

// MongoDB
const MONGO_URI = "mongodb+srv://abrahamaldaco_db_user:D2wRJCAzJ5j8JJzZ@cluster0.hnpc6xp.mongodb.net/?appName=Cluster0";
const DBNAME = "cs3870db";
const COLLECTION = "contacts";
const client = new MongoClient(MONGO_URI);
const db = client.db(DBNAME);

app.get("/name", (req, res) => { 
   res.send("My name is Abraham");
} );

app.get("/contacts", async(req, res) => {

    try{
        await client.connect();
        console.log("Node connected successfully to GET MongoDB");
        const query = {};

        const results = await db
        .collection(COLLECTION)
        .find(query)
        .limit(100)
        .toArray();
        console.log(results);
        
        res.status(200);
        //   res.send(results);
        res.json(results);
        // res.json({status:"success",message:"Contacts retrieved successfully", count:results.length, data:results});
    } catch(error){
        console.error("Error in GET /contacts:", error);
        res.status(500);
        res.json({message:"Failed to retrieve contacts"+error.message});
    }
 } );


 // review one contact by its name
 app.get("/contacts/:name", async (req,res)=>{
    try {
        const contactName = req.params.name;
        console.log("Contact to find :", contactName);

        await client.connect();
        console.log("Node connected successfully to GET-id MongoDB");

        const query = {contact_name: contactName };

        const results = await db.collection(COLLECTION)
        .findOne(query);

        console.log("Results :", results);

        if (!results) {
            res.status(404);
            res.json({message:"Not Found"});
        } else {
            res.status(200);
            res.json(results);
        }
    } catch(error){
        console.error("Error in GET /contacts:", error);
        res.status(500);
        res.json({message:"Failed to retrieve contacts"+error.message});
    }
 });

app.post("/contacts", async (req, res)=>{

    try {

        // The body exists
        if (!req.body || Object.keys(req.body).length === 0) {
         return res.status(400).send({ message: 'Bad request: No data provided.' });
        }

        // Extract fields from body
        const { contact_name, phone_number, message, image_url } = req.body;

        // Connect to MongoDB
        await client.connect();
        console.log("Node connected successfully to POST MongoDB");

        // Reference collection
        const contactsCollection = db.collection(COLLECTION);

        // Check if contact already exists
        const existingContact = await contactsCollection.findOne({
            contact_name: contact_name,
        });

        if (existingContact) {
            return res.status(409).json({
                message: `Contact with name ${contact_name} already exists.`,
            });
        }

        // Create new Document to POST
        const newDocument = {
            contact_name,
            phone_number,
            message,  
            image_url,
        };
        console.log(newDocument);

        // Insert new document into MongoDB
        const result = await contactsCollection.insertOne(newDocument);
        console.log("Document inserted:", result);

        // Acknowledge frontend
        res.status(201);
        res.json({message: "Response: New contact added successfully"});

    } catch (error) {
        console.error("Error in POST /contacts:", error);
        res.status(500);
        res.json({message: "Failed to add contact: " + error.message });
    } finally {
        await client.close();
    }
});

app.delete("/contacts/:name", async (req, res) => {
    try {
        // Read parameter id         
        const name = req.params.name;
        console.log("Contact to delete :",name);

        // Connect to MongoDB
        await client.connect();
        console.log("Node connected successfully to POST MongoDB");

        // Reference collection
        const contactsCollection = db.collection(COLLECTION);

        // Check if contact already exists
        const existingContact = await contactsCollection.findOne({
            contact_name: name,
        });

        if (!existingContact) {
            return res.status(404).json({
                message: `Contact with name ${name} does NOT exist.`,
            });
        }
       
        // Define query
        const query = { contact_name: name };
        
        // Delete one contact
        const results = await db.collection("contacts").deleteOne(query);

        // Response to Client
        res.status(200);
        // res.send(results);
        res.send({ message: `Contact ${name} was DELETED successfully.` });
    }
    catch (error){
        console.error("Error deleting robot:", error);
        res.status(500).send({ message: 'Internal Server Error'+error });
    }
});



// Start server
app.listen(PORT, HOST, () => {
 console.log(`Server running at http://${HOST}:${PORT}`);
});
