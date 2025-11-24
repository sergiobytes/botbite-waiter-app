import { Injectable } from '@angular/core';
import {
  Bot,
  Download,
  Hand,
  House,
  LayoutList,
  MapPin,
  Menu,
  MessagesSquare,
  Power,
  ScrollText,
  StarIcon,
  Users,
  Utensils,
} from 'lucide-angular';

@Injectable({
  providedIn: 'root',
})
export class IconsService {
  readonly power = Power;
  readonly menu = Menu;
  readonly house = House;
  readonly users = Users;
  readonly categories = StarIcon;
  readonly restaurants = Utensils;
  readonly branches = MapPin;
  readonly products = LayoutList;
  readonly download = Download;
  readonly orders = ScrollText;
  readonly message = MessagesSquare;
  readonly assistant = Bot;
  readonly hand = Hand;
}
