'use babel';

import React from 'react';
import ImgHouse from '../common/imgHouse.jsx'

export default class MiddleField extends React.Component {
  render() {
    return (
    <div className="middle-field">
        <ImgHouse path="../images/ava.png" />
        <p>{this.props.ya_balance}</p>
        <p>{this.props.qiwi_balance}</p>
        <div className="hr-div">

        </div>
    </div>)
  }
}
