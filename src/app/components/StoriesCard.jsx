import Image from "next/image";
import Link from "next/link";
import { IMAGE_PLACEHOLDER } from "@/lib/constants";
import { formatDate, getExcerpt, getImageUrl, readingTime } from "@/lib/articleUtils";
import Avatar from "./ui/Avatar";

const StoriesCard = ({ post }) => {
  const imageUrl = getImageUrl(post.cover_image) || IMAGE_PLACEHOLDER;
  const authorName = post.users?.name || post.author_name || "Author";
  const createdAt = post.published_at || post.created_at || post.updated_at;

  return (
    <Link href={`/read/${post.slug}`} className="group block w-full">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm bg-gray-100">
        <Image
          src={imageUrl}
          fill
          sizes="(min-width: 768px) 360px, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          alt={post.title}
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Avatar src={post.users?.avatar} name={authorName} size={20} />
        <span className="text-[13px] text-gray-600">{authorName}</span>
      </div>

      <h3 className="mt-2 line-clamp-2 font-creato text-xl font-bold leading-snug tracking-tight text-black">
        {post.title}
      </h3>

      <p className="mt-1.5 line-clamp-2 text-sm text-gray-500">{getExcerpt(post, 140)}</p>

      <p className="mt-3 text-[13px] text-gray-500">
        {formatDate(createdAt)} · {readingTime(post.content)} min read
      </p>
    </Link>
  );
};

export default StoriesCard;
