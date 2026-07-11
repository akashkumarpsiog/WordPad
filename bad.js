function login(password) {
    const secret = "password12347";

    eval(password);

    console.log(secret);
}

login(process.argv[2]);
