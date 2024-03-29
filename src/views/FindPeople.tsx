import { useState, useEffect, useMemo } from 'react'
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Button,
  IconButton,
  Snackbar,
  Typography,
  useTheme
} from '@mui/material'
import { Visibility as VisibilityIcon } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { follow } from '../services/userService'
import auth, { Jwt } from '../auth/authHelper'
import { findPeople } from '../services/userService'
import { TUser } from './Profile'

const baseUrl = 'https://social-media-app-backend-production-909f.up.railway.app'

export default function FindPeople() {
  const theme = useTheme()
  const [users, setUsers] = useState<TUser[] | []>([])
  const [values, setValues] = useState({
    open: false,
    followMessage: ''
  })

  const jwt: Jwt = useMemo(() => auth.isAuthenticated(), [])

  useEffect(() => {
    const abortController = new AbortController()
    const signal = abortController.signal

    findPeople(
      {
        userId: jwt.user._id
      },
      {
        t: jwt.token
      },
      signal
    ).then(data => {
      if (data && data.error) {
        console.log(data.error)
      } else {
        setUsers(data)
      }
    })

    return function cleanup() {
      abortController.abort()
    }
  }, [jwt])

  const handleFollow = (user: TUser, index: number) => {
    follow(
      {
        userId: jwt.user._id
      },
      {
        t: jwt.token
      },
      user._id
    ).then(data => {
      if (data.error) {
        console.log(data.error)
      } else {
        const toFollow = users
        toFollow.splice(index, 1)

        setValues({
          ...values,
          open: true,
          followMessage: `Following ${user.name}!`
        })
        setUsers(toFollow)
      }
    })
  }

  const handleClose = () => {
    setValues({
      ...values,
      open: false
    })
  }

  return (
    <List>
      <Typography variant="h5" sx={{ mb: theme.spacing(3) }}>
        Who to follow
      </Typography>
      {users.map((item, i) => {
        return (
          <span key={i}>
            <ListItem sx={{ p: 0, mb: theme.spacing(2) }}>
              <ListItemAvatar>
                <Avatar src={baseUrl + '/api/users/photo/' + item._id} />
              </ListItemAvatar>
              <ListItemText primary={item.name} />
              <ListItemSecondaryAction sx={{ right: 0 }}>
                <Link to={'/user/' + item._id}>
                  <IconButton color="secondary">
                    <VisibilityIcon />
                  </IconButton>
                </Link>
                <Button
                  sx={{ ml: theme.spacing(2) }}
                  aria-label="Follow"
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    handleFollow(item, i)
                  }}
                >
                  Follow
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          </span>
        )
      })}
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        open={values.open}
        onClose={handleClose}
        autoHideDuration={6000}
        message={<span>{values.followMessage}</span>}
      />
    </List>
  )
}
