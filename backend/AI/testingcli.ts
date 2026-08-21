import readlineSync from "readline-sync";

// Exactly like Python: name = input("What is your name? ")
const name: string = readlineSync.question("What is your name? ");
console.log(`Hello, ${name}!`);

// For hidden inputs (like Python's getpass)
const password: string = readlineSync.question("Enter password: ", {
  hideEchoBack: true, // Masks the input text
});
