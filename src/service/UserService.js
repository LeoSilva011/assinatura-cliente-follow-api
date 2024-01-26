const User = require('../model/userModel');

class UserService{
    static async getAllUsers(){
        return User.findAll();
    }
}

module.exports = UserService;