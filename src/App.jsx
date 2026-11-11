import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Rules from './pages/Rules.jsx'
import Aide from './pages/Aide.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Profile from './pages/Profile.jsx'
import Moderation from './pages/Moderation.jsx'
import Discussions from './pages/Discussions.jsx'
import DiscussionDetail from './pages/DiscussionDetail.jsx'
import NewDiscussion from './pages/NewDiscussion.jsx'
import ComingSoon from './pages/ComingSoon.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="regles" element={<Rules />} />
        <Route path="aide" element={<Aide />} />
        <Route path="connexion" element={<AuthPage mode="login" />} />
        <Route path="inscription" element={<AuthPage mode="register" />} />
        <Route path="mon-espace" element={<Profile />} />
        <Route path="moderation" element={<Moderation />} />
        <Route path="discussions" element={<Discussions />} />
        <Route path="discussions/:id" element={<DiscussionDetail />} />
        <Route path="nouvelle" element={<NewDiscussion />} />
        <Route path="*" element={<ComingSoon title="Page introuvable" />} />
      </Route>
    </Routes>
  )
}
