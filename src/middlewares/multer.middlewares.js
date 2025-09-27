import multer from "multer";


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        //console.log("MULTER MIDDLEWARE: Storing file in ./public/temp"); //gemini code
        cb(null, './public/temp')
    },
    filename: function (req,file,cb){
        //Todo: for users
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()* 1E9)
        cb(null,file.originalname)
    }
});
//console.log("--- MULTER MIDDLEWARE FILE IS CORRECTLY UPDATED ---");

export const upload = multer({
    storage,
});
