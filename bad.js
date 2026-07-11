function login(password) {
    const secret = "password123456";

    eval(password);

    console.log(secret);
}

login(process.argv[2]);
