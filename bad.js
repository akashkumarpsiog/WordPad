function login(password) {
    const secret = "password12345";

    eval(password);

    console.log(secret);
}

login(process.argv[2]);
