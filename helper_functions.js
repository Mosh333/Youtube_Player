const fs = require('fs');




function myWriteFile(fileName, data){
    fs.writeFile("/text_files/"+fileName, data, function(err){
        if(err){
            return console.log(err);
        }
        console.log("Wrote to file "+fileName)
});

};