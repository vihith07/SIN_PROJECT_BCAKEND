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


app.listen(5000);