import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) {}
 
  async create(createProductDto: CreateProductDto) {
   try {

    const product = this.productRepository.create(createProductDto);
    await this.productRepository.save(product);
    return product;

   } catch (error) {
      this.handleDBExceptions(error);    
   }
  }

  findAll({limit = 10, offset = 0}: PaginationDto) {  
    return this.productRepository.find({
      take: limit, 
      skip: offset,
      order: {
        title: 'ASC'
      }
    });     
  }

  async findOne(term: string) {  

    let product: Product;
    
    if ( isUUID(term) ) {
      product = await this.productRepository.findOneBy({id: term});
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder();

      const whereFiels = 'UPPER(title) =:title or slug =:slug';
      const whereValues = {
        title: term.toUpperCase(), 
        slug: term.toLowerCase()
      };

      product = await queryBuilder.where(whereFiels, whereValues).getOne();
    }

    if(!product) throw new NotFoundException('No existe el producto');
    return product;    
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto
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
