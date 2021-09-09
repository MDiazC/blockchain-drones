import Web3 from "web3";

const getWeb3 = ()  =>
  new Promise( async(resolve, reject) => {

    //var  dir = "127.0.0.1:22001";
    var dir = "127.0.0.1:8545";

    const provider = new Web3.providers.HttpProvider("http://"+dir);
    const web3 = new Web3(provider);
    var events_active = false;

    //Listen to events
    if(dir === "127.0.0.1:8545"){
      const eventProvider = new Web3.providers.WebsocketProvider('ws://'+dir);
      web3.setProvider(eventProvider);
      events_active = true;
    }

    console.log("No web3 instance injected, using Local web3.");
    resolve([web3, events_active]);
  });

export default getWeb3;
