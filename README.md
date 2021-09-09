# Ethereum project using tokens ERC20 and ERC721
This is a project I did for a blockchain course. This project is about drones and plots. Basically the owner of the plot is able, using blockchain to book a drone to fumigate the plot. 
The frontend of the project is made using React and the backend Ethereum.
In the frontend there are two main panels. 
Drone manager, which creates and destroy the drones.
Plot manager which creates, destroy, asks for drones to fumigate the plots and allows plot owners to buy tokens that will be used to pay drones fumigations.
The logic is in the backend, this part validates inputs (also are prevalidated in frontend) and stores the info in the blockchain (basically drones & plots atributes). Also controls the logic of asignating a drone to a plot. Drones have a minimum and maximum height where they can work. Plots are in a determined height, backend logic checks that there are drones ready to flight in plot's height. Backend logic checks plot owner has enough tokens to book the drone, if he/she does have enough token backend logic first gets the tokens (charges the plot owner) and then books the drone (what would be starting the fumigation).
This project is not time related, if a drone is available now it books it. If there are no drones available or you don't have enough tokens, it returns an error message, there is no queue for the drones.
This project has implemented some security features, we use 'Ownable' contracts (from OpenZeppelin) do validate the person who call certain functions is the owner. We also user ERC20 and ERC721 contracts from OpenZeppelin. There is also a proxy contracts that manages all the calls, in case we need to change any contract.
The project also has tests that checks the basic  actions of the project. There are some Chai tests and some solidity tests.

This project was developped to work on Alastria blockchain (which is a private blockchain that uses Hyperledger) but they user the compiler version 0.4. So maybe this project will need some tweaks to compile for newer versions son solidity compiler.
