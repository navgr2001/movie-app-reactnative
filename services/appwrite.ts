import {
  Account,
  Client,
  Databases,
  ID,
  Permission,
  Query,
  Role,
} from "react-native-appwrite";

const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!; // must be the real ID
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID!; // must be the real ID
const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!;

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);

const databases = new Databases(client);
const account = new Account(client);

// Call once on app start (see _layout.tsx change below)
export const initAppwrite = async () => {
  try {
    await account.get();
  } catch {
    await account.createAnonymousSession();
  }
};

// Log/aggregate a search
export const updateSearchCount = async (query: string, movie: Movie) => {
  try {
    // differentiate by both search term and movie id
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("searchTerm", query),
      Query.equal("movie_id", movie.id),
      Query.limit(1),
    ]);

    if (result.total > 0) {
      const doc = result.documents[0] as any;
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
        count: (doc.count || 0) + 1,
      });
    } else {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          searchTerm: query,
          movie_id: movie.id,
          title: movie.title,
          count: 1,
          poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        },
        // document-level permissions for reads/updates; create permission is set at collection level
        [
          Permission.read(Role.any()),
          Permission.update(Role.users()),
          Permission.delete(Role.users()),
        ]
      );
    }
  } catch (error) {
    console.error("Error updating search count:", error);
    throw error;
  }
};

export const getTrendingMovies = async (): Promise<
  TrendingMovie[] | undefined
> => {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.orderDesc("count"),
      Query.limit(5),
    ]);
    return result.documents as unknown as TrendingMovie[];
  } catch (error) {
    console.error(error);
    return undefined;
  }
};
