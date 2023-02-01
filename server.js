const express=require('express');
const app=express();
const cors=require('cors');
const mongoose=require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/SIN_PROJECT_DB",{ useNewUrlParser: true});
app.use(cors());
app.use(express.json());

const commentSchema=new mongoose.Schema({
    comment:String,
    feature:String,
    apikey:String,
    commenterid:String
});

const commentModel=mongoose.model("comment",commentSchema);



app.post("/comment/:APIKEY/:FEATURE/:UID",async (req,resp)=>{
    let lst1= new commentModel({
        comment:req.body.comment,
        feature:req.params.FEATURE,
        apikey:req.params.APIKEY,
        commenterid:req.params.UID
    });
    try{
        await lst1.save();
        const obj={
            stat:200,
            response:"data submitted"
        };
        resp.send(JSON.stringify(obj));
    }
    catch(err){
        const obj={
            stat:201,
            response:"data submitted"
        };
        resp.send(JSON.stringify(obj));
    }
    
});

app.listen(5000);