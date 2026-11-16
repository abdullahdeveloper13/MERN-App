type CollectionModel = {
  createCollection(): Promise<unknown>;
  createIndexes(): Promise<unknown>;
  collection: { drop(): Promise<unknown> };
};

function hasMongoCode(error: unknown, code: number): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

export async function createCollectionWithIndexes(model: CollectionModel): Promise<void> {
  try {
    await model.createCollection();
  } catch (error) {
    if (!hasMongoCode(error, 48)) {
      throw error;
    }
  }

  await model.createIndexes();
}

export async function dropCollection(model: CollectionModel): Promise<void> {
  try {
    await model.collection.drop();
  } catch (error) {
    if (!hasMongoCode(error, 26)) {
      throw error;
    }
  }
}
