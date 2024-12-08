require('dotenv').config();
const express = require('express');
const cors =  require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();


app.use(cors());
app.use(express.json());
 
    


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.uxfsb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const campaignCollection = client.db('campaignDB').collection('campaign');
    

    app.post('/campaign',async(req,res)=>{
      const newCampaign = req.body;
      console.log("Adding new campaign",newCampaign);
      const result = await campaignCollection.insertOne(newCampaign);
      res.send(result);
    })


    app.get('/campaigns',async(req,res)=>{
      const cursor = campaignCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/campaigns/:id',async(req,res)=>{
      const {id}= req.params;
      const query = {_id: new ObjectId(id)};
      const result = await campaignCollection.findOne(query);
      res.send(result);
    })



    app.get('/myCampaign/:email', async (req, res) => {
      const userEmail = req.params.email;  // Correct way to extract email from params
      console.log(userEmail)
      const query = {userEmail: userEmail};
      const result = await campaignCollection.find(query).toArray();
      res.send(result)


    });


    

     
    app.get('/camp', async (req, res) => {
      try {
        const currentDate = new Date(); // Get the current date
        const runningCampaigns = await campaignCollection.find({
          deadline: { $gt: currentDate.toISOString().split('T')[0] }  // Convert to date string without time
        }).limit(6).toArray();
    
        res.json(runningCampaigns);
      } catch (error) {
        console.error('Error fetching running campaigns:', error);
        res.status(500).json({ message: 'Error fetching running campaigns' });
      }
    });
    


    app.patch('/campaigns/:id', async (req, res) => {
      const _id = req.params.id;
    
      // Validate ObjectId
      if (!ObjectId.isValid(_id)) {
        return res.status(400).json({ message: 'Invalid campaign ID' });
      }
    
      const filter = { _id: new ObjectId(_id) };
    
      // Destructure the request body to avoid including _id
      const { _id: id, ...updateFields } = req.body;
    
      const updatedDoc = {
        $set: updateFields,
      };
    
      try {
        const result = await campaignCollection.updateOne(filter, updatedDoc);
    
        if (result.modifiedCount > 0) {
          res.status(200).json({
            message: 'Campaign updated successfully',
            modifiedCount: result.modifiedCount,
          });
        } else {
          res.status(404).json({
            message: 'No campaign found or no changes made',
            modifiedCount: result.modifiedCount,
          });
        }
      } catch (err) {
        console.error("Error updating campaign:", err);
        res.status(500).json({ message: 'Error updating campaign', error: err.message });
      }
    });
    
    

    app.delete('/campaigns/:id',async(req,res)=>{
      console.log('campagin going to be deleted',req.params.id);
      const id = req.params.id;
      const query = {_id:new ObjectId(id)}
      const result = await campaignCollection.deleteOne(query);
      res.send(result);
    })
    
    




  const userCollection = client.db('campaignDB').collection('user')
  const donatedCollection = client.db('campaignDB').collection('donatedCollection')
  // create user
    app.post('/user',async(req,res)=>{
      const newUser = req.body;
      console.log("Adding New User",newUser);
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    })

    //login user,or get user data based on email

    app.post('/login', async (req, res) => {
      const { email } = req.body;
      const user = await userCollection.findOne({ email });
      if (user) {
          res.json(user); // Ensure you send a JSON response
      } else {
          res.status(404).json({ message: 'User not found' }); // Send an appropriate error message
      }
  });

  app.put('/users', async (req, res) => {
    const { email, name, photoURL } = req.body;
    const filter = { email }; // Find by email
    const update = { $set: { name, photoURL, lastSignInTime: new Date() } };
    const options = { upsert: true }; // Create if not found
  
    try {
      const result = await userCollection.updateOne(filter, update, options);
      res.send(result);
    } catch (error) {
      res.status(500).send({ message: "Error updating or creating user", error });
    }
  });






  // app.post('/donate',async(req,res)=>{
  //   const newDonation = req.body;
  //   const result = await donatedCollection.insertOne(newDonation);
  //   res.send(result);

    
  // })





  // app.post('/donater',async(req,res)=>{
  //   const newDonation =  req.body;
  //   const result = await donatedCollection.insertOne(newDonation);
  //   res.send(result);

  // })

  app.post('/donater', async (req, res) => {
    try {
      const { _id, ...newDonation } = req.body; // Exclude _id if it's present
      const result = await donatedCollection.insertOne(newDonation);
      res.status(201).send(result); // Send a 201 status for resource creation
    } catch (err) {
      console.error('Error inserting donation:', err);
      res.status(500).send({ message: 'Internal server error' });
    }
  });
  




  // Route to retrieve user's donations
  app.get('/myDonations/:email', async (req, res) => {
    const email = req.params.email;
  
    try {
      // Find documents where the email matches
      const result = await donatedCollection.find({ email: email }).toArray();
      res.status(200).send(result); // Send the result back to the client
    } catch (err) {
      console.error('Error fetching donations:', err);
      res.status(500).send({ message: 'Internal server error' }); // Handle errors
    }
  });
  



    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.send('simple crud is running')
})

app.listen(port,()=>{
    console.log(`simple crud is running on ${port}`)
})








// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const { MongoClient, ServerApiVersion } = require('mongodb');

// const port = process.env.PORT || 5000;
// const app = express();

// app.use(cors());
// app.use(express.json());

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.uxfsb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     const campaignCollection = client.db('campaignDB').collection('campaign');
//     const userCollection = client.db('userDB').collection('user');

//     app.post('/campaign', async (req, res) => {
//       const newCampaign = req.body;
//       console.log("Adding new campaign", newCampaign);
//       const result = await campaignCollection.insertOne(newCampaign);
//       res.send(result);
//     });

//     app.post('/user', async (req, res) => {
//       const newUser = req.body;
//       console.log("Adding New User", newUser);
//       const result = await userCollection.insertOne(newUser);
//       res.send(result);
//     });

//     app.post('/login', async (req, res) => {
//       const { email } = req.body;
//       const user = await userCollection.findOne({ email });
//       if (user) {
//         res.send(user);
//       } else {
//         res.status(401).send({ message: 'Invalid credentials' });
//       }
//     });

//     await client.connect();
//     console.log("Connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }
// }
// run().catch(console.dir);

// app.get('/', (req, res) => {
//   res.send('Server is running');
// });

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
