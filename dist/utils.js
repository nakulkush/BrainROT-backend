"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomhash = randomhash;
function randomhash(len) {
    const options = "qwertyuiopasdfghjklzxcvbnm1234567890";
    const length = options.length;
    let ans = "";
    for (let i = 0; i < len; i++) {
        ans += options[Math.floor(Math.random() * length)];
    }
    return ans;
}
