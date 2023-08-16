const express = require("express");
const { toHex } = require("ethereum-cryptography/utils");
const app = express();
const cors = require("cors");
const port = 3042;
const { secp256k1 } = require("ethereum-cryptography/secp256k1");

app.use(cors());
app.use(express.json());

const balances = {
  "0341c178e18d96f6a6127c908f1b616e97087d3a70496a6056a1687bb61ff9d79c": 100,
  "02d5ba61f08185ed2e4503248c6607d25efb5222e06a90130d31fe1e763646302c": 50,
  "03ea7ad821873483643015cc49ead6bd6c7c4debbf419dc74e5f43ac60f0381096": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", async(req, res) => {
//todo: get signature from client side
//recover public address
  const { msg, msgHash, signature, recovery } = req.body;
  const {sender, recipient, amount} = JSON.parse(msg);

  setInitialBalance(sender);
  setInitialBalance(recipient);

  const sig = (secp256k1.Signature.fromCompact(signature).addRecoveryBit(recovery));
  const isValid = sig.recoverPublicKey(msgHash).toHex() == sender;
  
  if (!isValid) {
    res.status(400).send({ message: "Invalid signature" });
  }

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
