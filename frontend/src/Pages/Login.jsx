import Input from '../Components/input.jsx'

export default function Login({loginStatus, userEmail}) {

  return (
    <div>
      <Input loginStatus={loginStatus} userEmail={userEmail} />
    </div>
  )
}