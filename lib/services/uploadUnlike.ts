import firebase from 'firebase/app';
import 'firebase/firestore';
import { AuthUser, Post } from '../types';

async function uploadUnlike(post: Post, user: AuthUser) {
  let db = firebase.firestore();
  let postRef = db.collection('posts').doc(post.id);
  let postData = await postRef.get();
  let uniqueLikes = postData.data().likes.filter((id: string) => id !== user.uid);
  await postRef.update({ likes: uniqueLikes });
  return (await postRef.get()).data();
}

export default uploadUnlike;
