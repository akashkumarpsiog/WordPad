function login(password) {
    const secret = "password123497";

    eval(password);

    console.log(secret);
}

login(process.argv[2]);
