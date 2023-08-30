let lastMessage = module.exports = {
    message: [],
    update: function(message, guildID) {
        if(this.message.find(element => element.guildID == guildID)){
            this.message.find(element => element.guildID == guildID).url = message;
        }else{
            this.message.push({guildID, url: message})
        }
        console.log(guildID + ":updated to "+ message)
    },
    get: function(guildID){
        if(this.message.find(element => element.guildID == guildID)){
            return this.message.find(element => element.guildID == guildID).url;
        }else{
            return null
        }
    }
}