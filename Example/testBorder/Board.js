import React, { Component } from 'react';
import {
  Dimensions,
  Animated,
  View
} from 'react-native';
import Victor from 'victor';
import Square from './Square';
import Piece from './Piece';
import Arrow from './Arrow';
import CONSTANTS from './Constants';
// import Sound from './Sound';
import { reverseColor, getPosibleMoves, debugBorder, stringToPos, posToString } from './Helper';

import Svg,{
    Line,
    Polygon,
} from 'react-native-svg';

const { width } = Dimensions.get('window');

// const keys = [
//             [0, 1, 2, 3, 4, 5, 6, 7],
//             [8, 9, 10, 11, 12, 13, 14, 15],
//             [null, null, null, null, null, null, null, null],
//             [null, null, null, null, null, null, null, null],
//             [null, null, null, null, null, null, null, null],
//             [null, null, null, null, null, null, null, null],
//             [16, 17, 18, 19, 20, 21, 22, 23],
//             [24, 25, 26, 27, 28, 29, 30, 31]
//           ];

class Board extends Component {

  constructor() {
    super();
    this.state = {
      selectedPiece: null,
      arrow: {
        from: null,
        to: null,
        isVisible: false,
        rotateAngle: null,
      },
    };

    this.lastMove = {};
  }


  onPieceSelected(row, column, color, hasMoves) {
    // this.setArrowValues(stringToPos('d4'), stringToPos('d6'));
    if (this.state.selectedPiece !== null) {
      if (this.props.turn !== color) {
        this.onSquareSelected(row, column);
      } else {
        if (this.state.selectedPiece.row !== row || this.state.selectedPiece.column !== column) {
          //Reselect
          this.setSelectedPiece({ row, column, hasMoves });
        } else {
          //Unselect
          this.setSelectedPiece(null);
        }
      }
    } else {
      this.setSelectedPiece({ row, column, hasMoves });
    }
  }

  getPiece(row, column) {
    const t = posToString(row, column);
    return this.props.game.get(t);
  }

  setSelectedPiece(piece) {
    this.setState({ selectedPiece: piece });
  }

  onPressEmptySquare(row, column) {
    this.setSelectedPiece(null);
  }

  onSquareSelected(row, column) {
    if (this.state.selectedPiece === null) {
      return;
    }

    this.movePiece(row, column);
  }

  setArrowValues(from, to) {
    const isVisible = true;
    this.setState({ arrow: { isVisible, from, to}})
  }

  drawArrow() {
    if(this.state.arrow.isVisible) {
      return (
        <Arrow
          width = { width }
          from = { this.state.arrow.from }
          to = { this.state.arrow.to }
        />
      );
    }
  }


  makeRandomMove() {
    const possibleMoves = this.props.game.moves();

    if (possibleMoves.length === 0) return;

    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    this.props.game.move(possibleMoves[randomIndex]);
    this.props.turnComplete();
  }

  movePiece(row, column) {

    const { selectedPiece } = this.state;
    const { game, turn, captureCallback, moveCallback, turnComplete } = this.props;

    const move = {
      from: posToString(selectedPiece.row, selectedPiece.column),
      to: posToString(row, column),
      promotion: 'q',
    };

    const gameMove = game.move(move);

    if (gameMove) {
      // keys[row][column] = keys[selectedPiece.row][selectedPiece.column];
      // keys[selectedPiece.row][selectedPiece.column] = null;

      this.lastMove = gameMove;

      if(gameMove.captured) {
        const capturedPiece = { type: gameMove.captured, color: reverseColor(turn) };
        this.lastMove.captured = capturedPiece;
        captureCallback(capturedPiece);
      }
    }

    this.setArrowValues(stringToPos(this.lastMove.from), stringToPos(this.lastMove.to));

    moveCallback(row, column, this.lastMove);
    turnComplete();
  }

  getPieceTranfrom() {
    const degree = (this.props.isRotate) ? '180deg' : '0deg';
    return {
      transform: [
        { rotateX: degree },
      ]
    };
  }

  render() {
    const squares = [];
    const pieces = [];
    let moves = [];

    const currentColor = (this.props.twoPlayer) ? this.props.playerColor : this.props.turn;

    const gameState = this.props.game.fen().split(' ')[0].split('/');

    if (this.state.selectedPiece !== null) {
      moves = getPosibleMoves(this.props.game, this.state.selectedPiece.row, this.state.selectedPiece.column)
    }

    gameState.map((row, rowIndex) => {
      let column = 0;

      for (let i = 0; i < row.length; i++) {
        if (row.charAt(i).match(/\d/)) {
          for (let j = 0; j < parseInt(row.charAt(i)); j++) {
            squares.push(
              <Square
                column={column}
                row={rowIndex}
                isPiece = { false }
                ref = { CONSTANTS.COLUMNS[column] + CONSTANTS.ROWS[rowIndex]}
                selectable={this.state.selectedPiece !== null &&
                            moves.indexOf(CONSTANTS.COLUMNS[column]
                            + CONSTANTS.ROWS[rowIndex]) !== -1
                           }
                selected={false}
                key = { rowIndex + ' ' + i + '' + j }
                onSquareSelect={this.onSquareSelected.bind(this)}
                onPressEmptySquare={this.onPressEmptySquare.bind(this)}
              />
            );
            column++;
          }
        } else if (row.charAt(i).match(/[A-Za-z]/)) {
          squares.push(
            <Square
              column={column}
              row={rowIndex}
              ref = { CONSTANTS.COLUMNS[column] + CONSTANTS.ROWS[rowIndex]}
              isPiece = { true }
              selectable={this.state.selectedPiece !== null &&
                          moves.indexOf(CONSTANTS.COLUMNS[column]
                          + CONSTANTS.ROWS[rowIndex]) !== -1} //unuseles
              // selected={this.state.selectedPiece !== null &&
              //           this.state.selectedPiece.row === rowIndex &&
              //           this.state.selectedPiece.column === column}
              selectedPiece={this.state.selectedPiece}
              key = { rowIndex + ' ' + i + 'square'}
              onSquareSelect={this.onSquareSelected.bind(this)}
            />
          );
          const color = row.charAt(i).match(/[A-Z]/) ? CONSTANTS.WHITE : CONSTANTS.BLACK;

          pieces.push(
            <Piece
              piece={row.charAt(i).toLowerCase()}
              color={color}
              column={column}
              row={rowIndex}
              lastMove = { this.lastMove }
              game = { this.props.game }
              selectable={currentColor === color ||
                          moves.indexOf(CONSTANTS.COLUMNS[column]
                          + CONSTANTS.ROWS[rowIndex]) !== -1
                         }
              onPieceSelect={this.onPieceSelected.bind(this)}
              key = { rowIndex + ' ' + i + 'piece'}
              isRotate = { this.props.isRotate }
            />
          );
          column++;
        }
      }
    });

    return (
      <Animated.View style={[styles.container, this.getPieceTranfrom()]}>
        {squares.concat(pieces)}
        {this.drawArrow()}
      </Animated.View>
    );
  }

}

const styles = {
  container: {
    width: width,
    height: width,
    backgroundColor: '#F5FCFF',
    flexDirection: 'row',
    flexWrap: 'wrap'
  }
};

export default Board;
