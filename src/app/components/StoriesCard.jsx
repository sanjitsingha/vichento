import { storage } from "@/lib/appwrite";
import Link from "next/link";
import HTMLReactParser from "html-react-parser";

const BUCKET_ID = "article-images";
const StoriesCard = ({ post }) => {


  const imageUrl = post.featuredImage
    ? storage.getFileView(BUCKET_ID, post.featuredImage).toString()
    : "/blog_image.avif";


  const getAvatarUrl = (fileId) => {
    if (!fileId) return "/default-avatar.png";
    return storage.getFileView(BUCKET_ID, fileId);
  };

  return (
    <Link href={`/read/${post.slug}`}>
      <div className="w-full md:w-[380px]">
        <img
          src={imageUrl}
          className="w-full h-[160px] md:h-[200px] object-cover rounded-sm"
          alt={post.title}
        />

        <div className="py-2">
          <p className="text-xl font-creato font-regular tracking-tight">
            {post.title}
          </p>

          <p className="text-xs mt-2 text-black/40 line-clamp-2">
            {HTMLReactParser(post.content)}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-300">
            <img src={getAvatarUrl(post.authorAvatar)} alt="" />
          </div>
          <span className="text-[12px] text-gray-500 flex gap-2">
            <p>{post.authorName || "Admin"} </p> | <p>{new Date(post.$createdAt).toDateString()}</p>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default StoriesCard;
