import { Injectable } from '@angular/core';
import {
  ArrowLeft,
  ArrowRight,
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
  Search,
  ShieldCheck,
  ShieldX,
  StarIcon,
  UserPlus,
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

  readonly addUser = UserPlus;
  readonly search = Search;
  readonly active = ShieldCheck;
  readonly inactive = ShieldX;

  readonly next = ArrowRight;
  readonly previous = ArrowLeft;
}
