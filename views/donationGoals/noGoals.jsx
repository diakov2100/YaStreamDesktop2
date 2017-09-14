'use babel';

import React from 'react'

export default class NoGoals extends React.Component {
  render() {
    return (
        <div className="noGoals">
           <div className="btns">
                <p className="return"><span><img src="../images/bitmap.png" width="12" height="10" /></span> Назад</p>
                <h1 className="add">+ Добавить</h1>
            </div>
        </div>
    )
  }
}
