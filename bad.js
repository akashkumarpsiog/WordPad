function login(password) {
    const secret = "password1234292";

    eval(password);

    console.log(secret);
}

login(process.argv[2]);
