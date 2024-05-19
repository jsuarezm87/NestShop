import { BadRequestException, Injectable, InternalServerErrorException, 
         Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { ProductImage } from './entities/product-image.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>
  ) {}
 
  async create(createProductDto: CreateProductDto) {
   try {

    const {images = [], ...productDatail} = createProductDto;

    const product = this.productRepository.create({
      ...productDatail,
      images: images.map(image => this.productImageRepository.create({url: image}))
    });
    await this.productRepository.save(product);
    return {...product, images};

   } catch (error) {
      this.handleDBExceptions(error);    
   }
  }

  async findAll({limit = 10, offset = 0}: PaginationDto) {  

    const products = await this.productRepository.find({
      take: limit, 
      skip: offset,
      relations:{
        images: true
      },
      order: {
        title: 'ASC'
      }
    });     


    return products.map(product => ({
      ...product,
      images: product.images.map(img => img.url)
    }));

  }

  async findOne(term: string) {  

    let product: Product;
    
    if ( isUUID(term) ) {
      product = await this.productRepository.findOneBy({id: term});
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod');

      const whereFiels = 'UPPER(title) =:title or slug =:slug';
      const whereValues = {
        title: term.toUpperCase(), 
        slug: term.toLowerCase()
      };

      product = await queryBuilder
                      .where(whereFiels, whereValues)
                      .leftJoinAndSelect('prod.images', 'prodImages')
                      .getOne();
    }

    if(!product) throw new NotFoundException('No existe el producto');
    return product;    
  }

  async findOnePlain(term: string) {
    const {images=[], ...rest } = await this.findOne(term);
    return {
      ...rest,
      images: images.map(img => img.url)
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto,
      images: []
    });

    if (!product) throw new NotFoundException('No existe el producto');

    try {
      await this.productRepository.save(product);
      return product;  
     } catch (error) {
        this.handleDBExceptions(error);    
     }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
    return product;
  }

  private handleDBExceptions(error: any) {
    if(error.code === '23505') throw new BadRequestException(error.detail);      

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }

}
