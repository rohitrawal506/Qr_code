const commonMesaage = {};
commonMesaage.imageRequired = 'is required';
commonMesaage.addSuccess = 'added successfully';
commonMesaage.updateSuccess = 'updated successfully';
commonMesaage.deleteSuccess = 'deleted successfully';
commonMesaage.notFound = 'not found';
commonMesaage.isExists = 'is already exists';
commonMesaage.registerSuccess = 'has been registerd successfully';
commonMesaage.loginSuccess = 'successfully';
commonMesaage.logout = 'logout successfully'

commonMesaage.credentailError = 'Email or password is incorrect';
commonMesaage.list = 'list';
commonMesaage.error = 'Something went wrong';
commonMesaage.notAvailable = 'is not available';
commonMesaage.outOfStock = 'is out of stock';
commonMesaage.wrongPassword = 'Incorrect old passwoed';
commonMesaage.mail = 'Mail sent successfully';
commonMesaage.tokenExpried = 'This key is invalid or has already been used. If necessary, reset your password again';
commonMesaage.amountError = 'amount is wrong';
commonMesaage.itemError = 'Please select item';
commonMesaage.accedDenied = 'Access Denied'
commonMesaage.invalied = 'Invalied Image'
const apiMessages = (name, key) => {
    if (name == '') {
        return commonMesaage[key];
    }
    return name + ' ' + commonMesaage[key];
}

const apiExistsMessages = (name, key) => {
    return 'This ' + name + ' ' + commonMesaage[key];
}

module.exports = {
    apiMessages, apiExistsMessages
}