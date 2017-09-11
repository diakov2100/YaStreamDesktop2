'use babel';

import React from 'react';
import TitleBar from '../common/titleBar.jsx'
import MiddleField from './middleField.jsx'
import MenuBar from '../common/menuBar.jsx'

export default class MainMain extends React.Component {
  render() {
    let menubar = this.props.stream == 'true' ? ['Текущий стрим', 'История', 'Цели по сборам', 'Настройки аккаунта','Выход'] : ['Новый стрим', 'История', 'Цели по сборам', 'Настройки аккаунта','Выход']
    return (
    <div>
        <TitleBar windowName='ЯСтрим'/>
        <MiddleField ya_balance={this.props.ya_balance} qiwi_balance={this.props.qiwi_balance}/>
        <MenuBar points={menubar}/>
    </div>)
  }
}