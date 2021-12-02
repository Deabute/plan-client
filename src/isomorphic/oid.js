// oid ~ Copyright 2021 Paul Beaudet MIT License

// similar logic to new mongo.ObjectID() except this just returns a string
const createOid = () => {
  const increment = Math.floor(Math.random() * 16777216).toString(16);
  const pid = Math.floor(Math.random() * 65536).toString(16);
  const machine = Math.floor(Math.random() * 16777216).toString(16);
  const timestamp = Math.floor(new Date().valueOf() / 1000).toString(16);
  return (
    '00000000'.substr(0, 8 - timestamp.length) +
    timestamp +
    '000000'.substr(0, 6 - machine.length) +
    machine +
    '0000'.substr(0, 4 - pid.length) +
    pid +
    '000000'.substr(0, 6 - increment.length) +
    increment
  );
};

const getOidStamp = (oid) => {
  const timestamp = oid.substr(0, 8);
  return parseInt(timestamp, 16) * 1000;
};

const generatePassword = (length = 15) => {
  let password = '';
  const str =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';

  for (let i = 1; i <= length; i++) {
    let char = Math.floor(Math.random() * str.length + 1);
    password += str.charAt(char);
  }
  return password;
};

module.exports = {
  createOid,
  getOidStamp,
  generatePassword,
};
