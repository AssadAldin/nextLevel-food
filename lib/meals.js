import fs from "node:fs";
import sql from "better-sqlite3";
import slugify from "slugify";
import xss from "xss";

const db = sql("meals.db");

export async function getMeals() {
  // await new Promise((resolve) => setTimeout(resolve, 5000));
  // throw new Error("Loading meals failed");
  return db.prepare("SELECT * FROM meals").all();
}

export function getMeal(slug) {
  return db.prepare("SELECT * FROM meals WHERE slug = ?").get(slug);
}

export async function saveMeal(meal) {
  //slug
  meal.slug = slugify(meal.title, { lower: true });
  //secure the instruction from xss attack because we use dangerouslySetInnerHTML
  meal.instructions = xss(meal.instructions);
  //image section
  const extension = meal.image.name.split(".").pop(); // get the extension
  const fileName = `${meal.slug}.${extension}`;
  //adding the file to public folder
  const stream = fs.createWriteStream(`public/images/${fileName}`);
  const bufferedImage = await meal.image.arrayBuffer();
  stream.write(Buffer.from(bufferedImage), (error) => {
    if (error) {
      throw new Error("Saving image is failed");
    }
  });
  // overwrite the image file with image path to save it in database
  meal.image = `/images/${fileName}`;
  db.prepare(`
      INSERT INTO meals (title, summary, instructions, creator, creator_email, image, slug)
      VALUES (
        @title,
        @summary,
        @instructions,
        @creator,
        @creator_email,
        @image,
        @slug
      )
    `).run(meal);
}
