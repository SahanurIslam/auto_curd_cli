#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const name = process.argv[2];
const isNest = process.argv.includes('--nest');

if (!name) {
  console.log("❌ Please provide a model name. Example:");
  console.log("   node crud-generator.js User");
  console.log("   node crud-generator.js User --nest");
  process.exit(1);
}

const lower = name.toLowerCase();
const upper = name.charAt(0).toUpperCase() + name.slice(1);

if (isNest) {
  // ===== NESTJS STRUCTURE =====
  const baseDir = `src/${lower}`;
  const dirs = [
    "src",
    baseDir,
    `${baseDir}/dto`,
    "src/config"
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // 1. create-user.dto.ts
  const dtoContent = `export class Create${upper}Dto {
  // Define your DTO properties
  name: string;
}
`;
  fs.writeFileSync(`${baseDir}/dto/create-${lower}.dto.ts`, dtoContent);

  // 2. user.model.ts (Mongoose schema)
  const modelContent = `import { Schema } from 'mongoose';

export const ${upper}Schema = new Schema({
  name: String,
});
`;
  fs.writeFileSync(`${baseDir}/${lower}.model.ts`, modelContent);

  // 3. user.service.ts
  const serviceContent = `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${upper}Service {
  create(data: any) {
    return 'Create ${upper}';
  }
  findAll() {
    return 'List ${upper}s';
  }
  findOne(id: string) {
    return \`Get ${upper} \${id}\`;
  }
  update(id: string, data: any) {
    return \`Update ${upper} \${id}\`;
  }
  remove(id: string) {
    return \`Delete ${upper} \${id}\`;
  }
}
`;
  fs.writeFileSync(`${baseDir}/${lower}.service.ts`, serviceContent);

  // 4. user.controller.ts
  const controllerContent = `import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ${upper}Service } from './${lower}.service';
import { Create${upper}Dto } from './dto/create-${lower}.dto';

@Controller('${lower}s')
export class ${upper}Controller {
  constructor(private readonly ${lower}Service: ${upper}Service) {}

  @Post()
  create(@Body() dto: Create${upper}Dto) {
    return this.${lower}Service.create(dto);
  }

  @Get()
  findAll() {
    return this.${lower}Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.${lower}Service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Create${upper}Dto) {
    return this.${lower}Service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${lower}Service.remove(id);
  }
}
`;
  fs.writeFileSync(`${baseDir}/${lower}.controller.ts`, controllerContent);

  // 5. user.module.ts
  const moduleContent = `import { Module } from '@nestjs/common';
import { ${upper}Service } from './${lower}.service';
import { ${upper}Controller } from './${lower}.controller';

@Module({
  controllers: [${upper}Controller],
  providers: [${upper}Service],
})
export class ${upper}Module {}
`;
  fs.writeFileSync(`${baseDir}/${lower}.module.ts`, moduleContent);

  // 6. mongoose.config.ts
  const dbContent = `import { MongooseModule } from '@nestjs/mongoose';

export const dbConnection = MongooseModule.forRoot('mongodb://localhost:27017/crud-db');
`;
  fs.writeFileSync(`src/config/mongoose.config.ts`, dbContent);

  // 7. app.module.ts
  const appModuleContent = `import { Module } from '@nestjs/common';
import { ${upper}Module } from './${lower}/${lower}.module';
import { dbConnection } from './config/mongoose.config';

@Module({
  imports: [dbConnection, ${upper}Module],
})
export class AppModule {}
`;
  fs.writeFileSync("src/app.module.ts", appModuleContent);

  // 8. main.ts
  const mainContent = `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log("🚀 Server running at http://localhost:3000");
}
bootstrap();
`;
  fs.writeFileSync("src/main.ts", mainContent);

  console.log(`✅ NestJS project structure and CRUD files for "${upper}" generated.`);
} else {
  // ===== EXPRESS STRUCTURE =====
  const dirs = [
    "src",
    "src/config",
    "src/models",
    "src/controllers",
    "src/routes"
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  fs.writeFileSync("src/config/db.js", `const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/crud-db", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
`);

  fs.writeFileSync("src/app.js", `const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/${lower}s", require("./routes/${lower}.routes"));

module.exports = app;
`);

  fs.writeFileSync("src/server.js", `const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(\`🚀 Server is running at http://localhost:\${PORT}\`);
  });
});
`);

  fs.writeFileSync(`src/models/${lower}.model.js`, `const mongoose = require("mongoose");

const ${upper}Schema = new mongoose.Schema({
  // define schema fields
});

module.exports = mongoose.model("${upper}", ${upper}Schema);
`);

  fs.writeFileSync(`src/controllers/${lower}.controller.js`, `const ${upper} = require("../models/${lower}.model");

exports.create${upper} = async (req, res) => {
  try {
    const item = new ${upper}(req.body);
    const saved = await item.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.get${upper}s = async (req, res) => {
  try {
    const items = await ${upper}.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get${upper}ById = async (req, res) => {
  try {
    const item = await ${upper}.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update${upper} = async (req, res) => {
  try {
    const updated = await ${upper}.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete${upper} = async (req, res) => {
  try {
    await ${upper}.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
`);

  fs.writeFileSync(`src/routes/${lower}.routes.js`, `const express = require("express");
const router = express.Router();
const controller = require("../controllers/${lower}.controller");

router.post("/", controller.create${upper});
router.get("/", controller.get${upper}s);
router.get("/:id", controller.get${upper}ById);
router.put("/:id", controller.update${upper});
router.delete("/:id", controller.delete${upper});

module.exports = router;
`);

  console.log(`✅ Express project structure and CRUD files for "${upper}" generated.`);
}
