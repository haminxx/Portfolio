/**
 * Gameplay derived from Tetris-Basic (MIT) by Ania Kubow.
 * https://github.com/kubowania/Tetris-Basic
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import './TetrisWindow.css'

const WIDTH = 10
const HEIGHT = 20
const SIZE = WIDTH * HEIGHT
const COLORS = ['#ea580c', '#dc2626', '#9333ea', '#16a34a', '#2563eb']
const WALL = '#1c1917'

function buildTetrominoes(w) {
  return [
    [
      [1, w + 1, w * 2 + 1, 2],
      [w, w + 1, w + 2, w * 2 + 2],
      [1, w + 1, w * 2 + 1, w * 2],
      [w, w * 2, w * 2 + 1, w * 2 + 2],
    ],
    [
      [0, w, w + 1, w * 2 + 1],
      [w + 1, w + 2, w * 2, w * 2 + 1],
      [0, w, w + 1, w * 2 + 1],
      [w + 1, w + 2, w * 2, w * 2 + 1],
    ],
    [
      [1, w, w + 1, w + 2],
      [1, w + 1, w + 2, w * 2 + 1],
      [w, w + 1, w + 2, w * 2 + 1],
      [1, w, w + 1, w * 2 + 1],
    ],
    [
      [0, 1, w, w + 1],
      [0, 1, w, w + 1],
      [0, 1, w, w + 1],
      [0, 1, w, w + 1],
    ],
    [
      [1, w + 1, w * 2 + 1, w * 3 + 1],
      [w, w + 1, w + 2, w + 3],
      [1, w + 1, w * 2 + 1, w * 3 + 1],
      [w, w + 1, w + 2, w + 3],
    ],
  ]
}

const THE_TETROMINOES = buildTetrominoes(WIDTH)
const DISPLAY_WIDTH = 4
const UP_NEXT = [
  [1, DISPLAY_WIDTH + 1, DISPLAY_WIDTH * 2 + 1, 2],
  [0, DISPLAY_WIDTH, DISPLAY_WIDTH + 1, DISPLAY_WIDTH * 2 + 1],
  [1, DISPLAY_WIDTH, DISPLAY_WIDTH + 1, DISPLAY_WIDTH + 2],
  [0, 1, DISPLAY_WIDTH, DISPLAY_WIDTH + 1],
  [1, DISPLAY_WIDTH + 1, DISPLAY_WIDTH * 2 + 1, DISPLAY_WIDTH * 3 + 1],
]

function freshBoard() {
  const b = Array(SIZE).fill(null)
  for (let i = 0; i < WIDTH; i += 1) {
    b[(HEIGHT - 1) * WIDTH + i] = WALL
  }
  return b
}

function createState() {
  const random = Math.floor(Math.random() * THE_TETROMINOES.length)
  const nextRandom = Math.floor(Math.random() * THE_TETROMINOES.length)
  return {
    board: freshBoard(),
    currentPosition: 4,
    currentRotation: 0,
    random,
    nextRandom,
    current: THE_TETROMINOES[random][0],
    score: 0,
    gameOver: false,
    started: false,
  }
}

function mergeDisplay(st) {
  const out = [...st.board]
  st.current.forEach((idx) => {
    const pos = st.currentPosition + idx
    if (pos >= 0 && pos < out.length) {
      out[pos] = COLORS[st.random]
    }
  })
  return out
}

export default function TetrisWindow({ keyboardActive = true }) {
  const [, setVersion] = useState(0)
  const stateRef = useRef(null)
  const timerRef = useRef(null)

  const bump = () => setVersion((v) => v + 1)

  if (stateRef.current == null) {
    stateRef.current = createState()
  }

  const addScore = () => {
    const st = stateRef.current
    let changed = true
    while (changed) {
      changed = false
      for (let r = 0; r < HEIGHT - 1; r += 1) {
        const rowStart = r * WIDTH
        const idxs = Array.from({ length: WIDTH }, (_, k) => rowStart + k)
        if (idxs.every((idx) => st.board[idx] != null && st.board[idx] !== WALL)) {
          st.score += 10
          idxs.forEach((idx) => {
            st.board[idx] = null
          })
          for (let rr = r; rr > 0; rr -= 1) {
            for (let c = 0; c < WIDTH; c += 1) {
              st.board[rr * WIDTH + c] = st.board[(rr - 1) * WIDTH + c]
            }
          }
          for (let c = 0; c < WIDTH; c += 1) {
            st.board[c] = null
          }
          for (let c = 0; c < WIDTH; c += 1) {
            st.board[(HEIGHT - 1) * WIDTH + c] = WALL
          }
          changed = true
          break
        }
      }
    }
  }

  const freeze = () => {
    const st = stateRef.current
    st.current.forEach((idx) => {
      const pos = st.currentPosition + idx
      if (pos >= 0 && pos < st.board.length && st.board[pos] !== WALL) {
        st.board[pos] = COLORS[st.random]
      }
    })
    st.random = st.nextRandom
    st.nextRandom = Math.floor(Math.random() * THE_TETROMINOES.length)
    st.currentRotation = 0
    st.current = THE_TETROMINOES[st.random][st.currentRotation]
    st.currentPosition = 4
    addScore()

    if (st.current.some((idx) => st.board[st.currentPosition + idx] != null)) {
      st.gameOver = true
      st.started = false
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    bump()
  }

  const moveDown = () => {
    const st = stateRef.current
    if (st.gameOver || !st.started) return
    st.currentPosition += WIDTH
    if (st.current.some((idx) => st.board[st.currentPosition + idx] != null)) {
      st.currentPosition -= WIDTH
      freeze()
    } else {
      bump()
    }
  }

  const moveLeft = () => {
    const st = stateRef.current
    if (st.gameOver || !st.started) return
    const atLeft = st.current.some((idx) => (st.currentPosition + idx) % WIDTH === 0)
    if (!atLeft) st.currentPosition -= 1
    if (st.current.some((idx) => st.board[st.currentPosition + idx] != null)) {
      st.currentPosition += 1
    }
    bump()
  }

  const moveRight = () => {
    const st = stateRef.current
    if (st.gameOver || !st.started) return
    const atRight = st.current.some((idx) => (st.currentPosition + idx) % WIDTH === WIDTH - 1)
    if (!atRight) st.currentPosition += 1
    if (st.current.some((idx) => st.board[st.currentPosition + idx] != null)) {
      st.currentPosition -= 1
    }
    bump()
  }

  const isAtRight = () =>
    stateRef.current.current.some((idx) => (stateRef.current.currentPosition + idx + 1) % WIDTH === 0)

  const isAtLeft = () =>
    stateRef.current.current.some((idx) => (stateRef.current.currentPosition + idx) % WIDTH === 0)

  const checkRotatedPosition = (P) => {
    const st = stateRef.current
    const base = P ?? st.currentPosition
    if ((base + 1) % WIDTH < 4) {
      if (isAtRight()) {
        st.currentPosition += 1
        checkRotatedPosition(base)
      }
    } else if (base % WIDTH > 5) {
      if (isAtLeft()) {
        st.currentPosition -= 1
        checkRotatedPosition(base)
      }
    }
  }

  const rotate = () => {
    const st = stateRef.current
    if (st.gameOver || !st.started) return
    st.currentRotation += 1
    if (st.currentRotation === THE_TETROMINOES[st.random].length) {
      st.currentRotation = 0
    }
    st.current = THE_TETROMINOES[st.random][st.currentRotation]
    checkRotatedPosition()
    if (st.current.some((idx) => st.board[st.currentPosition + idx] != null)) {
      st.currentRotation -= 1
      if (st.currentRotation < 0) st.currentRotation = THE_TETROMINOES[st.random].length - 1
      st.current = THE_TETROMINOES[st.random][st.currentRotation]
    }
    bump()
  }

  const toggleStart = useCallback(() => {
    const st = stateRef.current
    if (st.gameOver) {
      stateRef.current = createState()
      bump()
      return
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
      st.started = false
      bump()
      return
    }
    st.started = true
    timerRef.current = setInterval(moveDown, 850)
    bump()
  }, [])

  useEffect(() => {
    if (!keyboardActive) return undefined
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        moveLeft()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        moveRight()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        moveDown()
      } else if (e.key === 'ArrowUp' || e.key === ' ') {
        e.preventDefault()
        rotate()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [keyboardActive])

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current)
    },
    [],
  )

  const st = stateRef.current
  const display = mergeDisplay(st)
  const next = st.nextRandom

  return (
    <div className="tetris-window" tabIndex={0}>
      <div className="tetris-window__main">
        <div className="tetris-window__grid" style={{ gridTemplateColumns: `repeat(${WIDTH}, 1fr)` }}>
          {display.slice(0, SIZE - WIDTH).map((c, i) => (
            <div
              key={i}
              className="tetris-window__cell"
              style={{ backgroundColor: c || 'rgba(30,30,34,0.92)' }}
            />
          ))}
        </div>
        <div className="tetris-window__side">
          <div className="tetris-window__score">
            <span className="tetris-window__score-label">Score</span>
            <span className="tetris-window__score-val">{st.gameOver ? 'Game over' : st.score}</span>
          </div>
          <p className="tetris-window__next-label">Next</p>
          <div
            className="tetris-window__mini"
            style={{ gridTemplateColumns: `repeat(${DISPLAY_WIDTH}, 1fr)` }}
          >
            {Array.from({ length: DISPLAY_WIDTH * DISPLAY_WIDTH }, (_, i) => {
              const on = UP_NEXT[next]?.includes(i)
              return (
                <div
                  key={i}
                  className="tetris-window__mini-cell"
                  style={{ backgroundColor: on ? COLORS[next] : 'rgba(0,0,0,0.2)' }}
                />
              )
            })}
          </div>
          <button type="button" className="tetris-window__start" onClick={toggleStart}>
            {st.gameOver ? 'Restart' : st.started ? 'Pause' : 'Start'}
          </button>
          <p className="tetris-window__hint">Arrows + Up / Space to rotate</p>
        </div>
      </div>
    </div>
  )
}
