import app from "app.ts"

const port = process.env.PORT;
app.listen(port, () => {
    console.log("Server running @ PORT", port);
})
