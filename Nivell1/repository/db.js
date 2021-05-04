const fs = require('fs');

(function createFiles(){
	if(!fs.existsSync('./data/data.json')){
		console.log(`Creating "data.json" file`);
		saveData([]);	
	}
})();

function saveData(data){
	fs.appendFileSync('./data/data.json', JSON.stringify(data));
}

function getData(){
    const data = fs.readFileSync('./data/data.json');
    return JSON.parse(data);
}

module.exports = { saveData, getData }
