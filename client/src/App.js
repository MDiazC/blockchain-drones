import React, { Component } from "react";
import DroniGateProxy from "./contracts/DroniGateProxy.json";

import "./App.css";

class App extends Component {
  state = { password: '', email: '', show_error:false, droniGateProxyAbi: {},
            proxy_contract_account: '0x0', token_contract_account: '0x0',
            plot_token_contract_account: '0x0', plot_manager_contract_account: '0x0' };

  constructor(props) {
    super();
    this.props = props;
    if(typeof this.props !== 'undefined' && typeof this.props.location !== 'undefined' && typeof this.props.location.state !== 'undefined'){
      this.state.show_error = props.location.state.show_error;
    }
  }

  componentDidMount = async () => {
    try {

      this.setState({droniGateProxyAbi: DroniGateProxy.abi});
      this.setState({proxy_contract_account: '0xb34455A699aDEf882C21af5aE0aD725B08903275'});
      this.setState({dronigate_token_contract_account: '0xB30D894F559c872F6273EB7A717BB8854996d7F6'});
      this.setState({plot_token_contract_account: '0x56481a269C14B0999f901FBEd91Dfd86881e5C36'});
      this.setState({plot_manager_contract_account: '0xF9Df2090C2480CA170B21Ab592518dEa661De549'});

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  handleChange = (event) => {
    let n = event.target.name;
    let v = event.target.value;
    this.setState({
        [n]: v
    })
    this.setState({show_error : false });
  }
  onSubmit = (event) => {
    event.preventDefault();

    if(this.state.password === "pass" && this.state.email === "admin@dronigate.io"){
          this.props.history.push({
            pathname: '/drone-manager',
            state: {
              email:this.state.email,
              proxy_contract_account: this.state.proxy_contract_account,
              droniGateProxyAbi: this.state.droniGateProxyAbi
            }
          });
    }else{
      if(this.state.password === "pass" && this.state.email === "plot@gmail.com"){
        this.props.history.push({
          pathname: '/plot-manager',
          state: {
            email:this.state.email,
            proxy_contract_account: this.state.proxy_contract_account,
            dronigate_token_contract_account: this.state.dronigate_token_contract_account,
            plot_token_contract_account: this.state.plot_token_contract_account,
            plot_manager_contract_account: this.state.plot_manager_contract_account,
            droniGateProxyAbi: this.state.droniGateProxyAbi
          }
        });
      }else{
        this.setState({email : '' });
        this.setState({password : '' });
        this.setState({show_error : true });
      }
    }
  }

  hideAlert = () =>{
    this.setState({ show_success: false, show_error: false});
  }

  render() {

    return (
      <div className="App">
        {this.state.show_error ?
          <div id="error_message" >
            <div id="error_message_title">Login error</div>
            <div id="error_message_desc">Incorrect credentials.<br />Please try again</div>
            <div id="close" onClick={this.hideAlert}>X</div>
          </div>
        : null }
        <div id="form_container">
        		<h1><div></div></h1>
        		<form onSubmit={this.onSubmit} className="appnitro">
    					<div className="form_description">
          			<h2>Login to Dronigate</h2>
          			<p></p>
          		</div>
              <div id="li_1">
                <label className="description" htmlFor="email">Email</label>
            		<div>
            			<input id="element_1" name="email" className="element text medium" type="email" placeholder="Type your email" onChange={this.handleChange} value={this.state.email}/>
            		</div>
              </div>
              <div id="li_2">
                <label className="description" htmlFor="password">Password</label>
            		<div>
            			<input id="element_2" name="password" className="element text medium" type="password" placeholder="Type your password" onChange={this.handleChange} value={this.state.password}/>
            		</div>
              </div>
              <div className="buttons">
                <input id="saveForm" className="button_text" type="submit" name="submit" value="Login" />
              </div>
        		</form>
        	</div>
      </div>
    );
  }
}

export default App;
