import { useState, useEffect } from 'react'
import auth from '../auth/authHelper'
import { read } from '../services/userService'
import { Navigate } from 'react-router'
import { Link, useMatch } from 'react-router-dom'
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material'
import { Person, Edit } from '@mui/icons-material'
import DeleteUser from './DeleteUser'
import FollowProfileButton from '../components/FollowProfileButton'
import ProfileTabs from './ProfileTabs'

const baseUrl = 'http://localhost:3500'

export type User = {
  _id: string
  name: string
  email: string
  password: string
  about: string
  created: number
  photo: {
    data: Buffer
  }
  following: []
  followers: []
}

export default function Profile() {
  const match = useMatch('/user/:userId')
  const [user, setUser] = useState<User | Record<string, never>>({})
  const [redirectToLogin, setRedirectToLogin] = useState(false)
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    const abortController = new AbortController()
    const signal = abortController.signal
    const jwt = auth.isAuthenticated()
    read({ userId: match.params.userId }, { t: jwt.token }, signal).then(data => {
      if (data && data.error) {
        setRedirectToLogin(true)
      } else {
        const following = checkFollow(data, jwt)
        setUser(data)
        setFollowing(following)
      }
    })
    // return function cleanup() {
    //   abortController.abort()
    // }
  }, [match.params.userId])

  if (redirectToLogin) {
    return <Navigate to="/signin" />
  }

  const checkFollow = (user, jwt) => {
    const match = user.followers.some(follower => follower._id == jwt.user._id)
    return match
  }

  const clickFollowButton = (callApi, jwt) => {
    callApi({ userId: jwt.user._id }, { t: jwt.token }, user._id).then(data => {
      if (data.error) {
        console.log(data.error)
      } else {
        setUser(data)
        setFollowing(!following)
      }
    })
  }

  const photoUrl = user.photo?.data
    ? `${baseUrl}/api/users/photo/${user._id}?${new Date().getTime()}`
    : `${baseUrl}/api/defaultPhoto`

  return (
    <Paper elevation={4}>
      <Typography variant="h6">Profile</Typography>
      <List dense>
        <ListItem>
          <ListItemAvatar>
            <Avatar src={photoUrl}>
              <Person />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary={user.name} secondary={user.email} />
          {auth.isAuthenticated().user && auth.isAuthenticated().user._id == user._id ? (
            <ListItemSecondaryAction>
              <Link to={'/user/edit/' + user._id} state={user}>
                <IconButton aria-label="Edit" color="primary">
                  <Edit />
                </IconButton>
              </Link>
              <DeleteUser userId={user._id} />
            </ListItemSecondaryAction>
          ) : (
            <ListItemSecondaryAction>
              <FollowProfileButton following={following} onButtonClick={clickFollowButton} />
            </ListItemSecondaryAction>
          )}
        </ListItem>
        <ListItem>
          <ListItemText primary={user.about} />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemText primary={'Joined: ' + new Date(user.created).toDateString()} />
        </ListItem>
      </List>
      <ProfileTabs user={user} />
    </Paper>
  )
}
