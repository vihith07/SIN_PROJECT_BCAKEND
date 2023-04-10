const express=require('express');
const app=express();
const cors=require('cors');

const aposToLexForm = require('apos-to-lex-form');
const natural = require('natural');
const SpellCorrector = require('spelling-corrector');
const spellCorrector = new SpellCorrector();
spellCorrector.loadDictionary();
const SW = require('stopword');


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


const AnalysisSchema=new mongoose.Schema({
    feature:String,
    apikey:String,
    pcomments:[{
        commentid:String,
        comment:String
    }],
    neucomments:[{
        commentid:String,
        comment:String
    }],
    ncomments:[{
        commentid:String,
        comment:String
    }]
});
const AnalysisModel=mongoose.model("analysi",AnalysisSchema);

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

app.get("/genratenlp/:API/:Feature",async (req,resp)=>{
    resp.send(JSON.stringify({
        stat: 200
    }));
    const isanalysis=await AnalysisModel.find({feature:req.params.Feature,apikey:req.params.API});
    if(isanalysis.length==0){
        const comments=await commentModel.find({feature:req.params.Feature,apikey:req.params.API});
        const positivecomments=[];
        const negativecomments=[];
        const neutralcomments=[];
    
        for(let i=0;i<comments.length;i++){
            const comment=comments[i].comment;
            const lexedReview = aposToLexForm(comment);
            const casedReview = lexedReview.toLowerCase();
            const alphaOnlyReview = casedReview.replace(/[^a-zA-Z\s]+/g, '');
            const { WordTokenizer } = natural;
            const tokenizer = new WordTokenizer();
            const tokenizedReview = tokenizer.tokenize(alphaOnlyReview);
            tokenizedReview.forEach((word, index) => {
                tokenizedReview[index] = spellCorrector.correct(word);
            })
            const filteredReview = SW.removeStopwords(tokenizedReview);
            const { SentimentAnalyzer, PorterStemmer } = natural;
            const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');
            const analysis = analyzer.getSentiment(filteredReview);
            if(analysis>0){
                let tobj={
                    commentid:comments[i].commenterid,
                    comment:comments[i].comment
                }
                positivecomments.push(tobj);
            }
            else if(analysis==0){
                let tobj={
                    commentid:comments[i].commenterid,
                    comment:comments[i].comment
                }
                neutralcomments.push(tobj);
            }
            else{
                let tobj={
                    commentid:comments[i].commenterid,
                    comment:comments[i].comment
                }
                negativecomments.push(tobj);
            }
        }
        // console.log(positivecomments);
        // console.log(neutralcomments);
        // console.log(negativecomments);
        let lst1= new AnalysisModel({
            feature:req.params.Feature,
            apikey:req.params.API,
            pcomments:positivecomments,
            neucomments:neutralcomments,
            ncomments:negativecomments
        });
        await lst1.save();
    }
})


app.post("/report/:API",async (req,resp)=>{
    console.log(req.body.idi)
    const arr=await AnalysisModel.find({apikey:req.params.API,feature:req.body.idi});
    await featureModel.deleteOne({usn:req.params.API,featname:req.body.idi});
    resp.send(JSON.stringify(arr));
})



const userSchema=new mongoose.Schema({
    usn:String,
    pass:String
});
const userModel=mongoose.model("userdet",userSchema);

app.post("/signup",async (req,resp)=>{
    let tuser=await userModel.find({usn:req.body.usn});
    if(tuser.length==0){
      let temp=new userModel({
        usn:req.body.usn,
        pass:req.body.pass
      });
      await temp.save();
      resp.send(JSON.stringify({
        err:"false"
      }))
    }
    else{
        resp.send(JSON.stringify({
            err:"true"
        }))
    }
})

app.post("/login",async (req,resp)=>{
    let tuser=await userModel.find({
        usn:req.body.usn
    });
    if(tuser.length==0){
        resp.send(JSON.stringify({
            err:"true"
        }))
    }
    else{
        if(req.body.pass==tuser[0].pass){
            resp.send(JSON.stringify({
                err:"false"
            })) 
        }
        else{
            resp.send(JSON.stringify({
                err:"true"
            }))
        }
    }
})


const freatureSchema=new mongoose.Schema({
    featname:String,
    fdesc:String,
    usn:String
});
const featureModel=mongoose.model("feature",freatureSchema);


app.post("/addFeature/:id",async (req,resp)=>{
    let obj=new featureModel({
        featname:req.body.title,
        fdesc:req.body.desc,
        usn:req.params.id,
    });
    await obj.save();
    resp.send(JSON.stringify(
        {
            code:200
        }
    ));
})

app.get("/getfeatures/:id",async(req,resp)=>{
    const arr=await featureModel.find({usn:req.params.id});
    resp.send(JSON.stringify(arr));
})







app.listen(5000);