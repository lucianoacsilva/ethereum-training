import React, { Component } from "react";
import SolidityDriveContract from "./contracts/SolidityDrive.json";
import getWeb3 from "./getWeb3";
import { StyledDropZone } from "react-drop-zone";
import { Table } from "reactstrap";
import FileIcon, { defaultStyles } from "react-file-icon";
import "react-drop-zone/dist/styles.css";
import "bootstrap/dist/css/bootstrap.css";
import "./App.css";
import FileReaderPullStream from "pull-file-reader";
import { Tab } from "bootstrap";
import Moment from "react-moment";
import ipfs from "./ipfs";

class App extends Component {
  state = { solidityDrive: [], web3: null, accounts: null, contract: null };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SolidityDriveContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SolidityDriveContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.getFiles);
      debugger
      window.ethereum.on("accountsChanged", async (accounts) => {
        const changedAccounts = await web3.eth.getAccounts();

        this.setState({
          accounts: changedAccounts
        });
        this.getFiles();
      });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  getFiles = async () => {
    // TODO
    const {
      accounts,
      contract
    } = this.state;

    try {
      const filesLength = await contract.methods
      .getLength()
      .call({
        from: accounts[0]
      });
  
      let files = [];
  
      for (let i = 0; i < filesLength; i++) {
        const file = await contract.methods
        .getFile(i)
        .call({
          from: accounts[0]
        });
        
        files.push(file);
        this.setState({
          solidityDrive: files
        });
        
      }
    } catch (error) {
      console.log(error);
    }
  }

  onDrop = async (file) => {
    try {
      const {
        contract,
        accounts
      } = this.state;

      // Create filestream to IPFS
      const stream = FileReaderPullStream(file);

      // Upload file to IPFS node
      const result = await ipfs.add(stream);

      // Generate informations to smart contract
      const timestamp = Math.round(+new Date() / 1000);
      const type = file.name.substr(file.name.lastIndexOf(".") + 1);

      // Upload data to smart contract
      const uploaded = await contract.methods.add(result[0].hash, file.name, type, timestamp)
            .send({
              from: accounts[0],
              gas: 300000
            });

      console.log(uploaded);
      this.getFiles();
    } catch (error) {
      console.log(error);
    }
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className = "App">
        <div className = "container pt-3">
          <StyledDropZone onDrop = {this.onDrop}>

          </StyledDropZone>
          <Table>
            <thead>
              <tr>
                <th width = "7%" scope = "row">Type</th>
                <th className = "text-left">File Name</th>
                <th className = "text-right">Date</th>
              </tr>
            </thead>

            <tbody>
              {this.state.solidityDrive !== [] ? this.state.solidityDrive.map((item, key) => (
                <tr>
                  <th>
                    <FileIcon 
                    size = {30}
                    extension = {item[2]}
                    {...defaultStyles[item[2]]}
                    ></FileIcon>
                  </th>
                  <th className = "text-left">
                    <a href = {"https://ipfs.io/ipfs/" + item[0]}>{item[1]}</a>
                  </th>
                  <th className = "text-right">
                    <Moment format = "YYYY/MM/DD" unix>{item[3]}</Moment>
                  </th>
                </tr>
              )) : null}
              
            </tbody>
          </Table>
        </div>
      </div>
    );
  }
}

export default App;
