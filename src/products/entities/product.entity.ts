import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductImage } from './product-image.entity';

@Entity()
export class Product {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'text',
        unique: true
    })
    title: string;

    @Column({
        type: 'float',
        default: 0
    })
    price: number;
    
    @Column({
        type: 'text',
        nullable: true
    })
    description: string;

    @Column({
        type: 'text',
        unique: true
    })
    slug: string;

    @Column({
        type: 'int',
        default: 0
    })
    stock: number;

    @Column({
        type: 'text',
        array: true
    })
    sizes: string[];

    @Column({
        type: 'text'
    })
    gender: string;

    @Column({
        type: 'text',
        array: true,
        default: []
    })
    tags: string[];

    // Esto es una relacion no un campo
    @OneToMany(
        ()=> ProductImage,
        (productImage) => productImage.product,
        {cascade: true, eager: true}
    )
    images?: ProductImage[];

    @BeforeInsert()
    checkSlugInsert() {
        if(!this.slug) this.slug = this.title;
        this.slug = this.slug.toLowerCase().replaceAll(' ', '_').replaceAll("'", '');
    }

    @BeforeUpdate()
    checkSlugUpdate() {
        if(this.slug) {
            this.slug = this.slug.toLowerCase().replaceAll(' ', '_').replaceAll("'", '');
        }
    }
}
