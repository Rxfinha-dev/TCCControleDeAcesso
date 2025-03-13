using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using MySql.Data;
using MySql.Data.MySqlClient;

namespace TCCControleDeAcesso.Models
{
    public class Banco
    {

        public static MySqlConnection Connection { get; set; }
        public static MySqlCommand Command { get; set; }    
        public static MySqlDataAdapter DataAdapter { get; set; }
        public static DataTable datTable { get; set; }


        public static void OpenConnection()
        {
            try
            {
                Connection = new MySqlConnection("server=localhost;port=3307;uid=root;pwd=etecjau");

                Connection.Open();
            } catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Conectar com o Banco", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public static void CloseConnection() 
        {
            try
            {
                Connection.Close();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Fechar a Conexão com o Banco", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public static void CreateDatabase()
        {
            try
            {
                //abre a conexão com o banco de dados
                OpenConnection();

                // Cria o banco de dados 'AccessControl' caso ele não exista e define seu uso
                Command = new MySqlCommand("create database if not exists AccessControl; Use AccessControl", Connection);       //Linha de comandos sql para a criação da base de dados
                Command.ExecuteNonQuery(); //execução do comando

                // Criação da tabela 'escolas'
                Command = new MySqlCommand("create table if not exists escolas" + 
                    "(id integer auto_increment primary key," +
                    "nome varchar(50)," +
                    "password char(8))", Connection);
                Command.ExecuteNonQuery();

                // Criação da tabela 'cursos'
                Command = new MySqlCommand("create table if not exists cursos" +
                    "(id integer primary key auto_increment," +
                    "nome varchar(30)," +
                    "idEscola int," +
                    "foreign key (idEscola) references escolas (id))", Connection);
                Command.ExecuteNonQuery();


                // Criação da tabela 'alunos'
                Command = new MySqlCommand("create table if not exists alunos " + 
                    "(id integer auto_increment primary key," +
                    "nome varchar(50)," +
                    "rm varchar(8)," +
                    "idCurso int," +
                    "idEscola int," +
                    "serie char(1)," +
                    "foto blob, " +
                    "digital blob," +
                    "foreign key (idEscola) references escolas (id)," +
                    "foreign key (idCurso) references cursos (id))", Connection);
                Command.ExecuteNonQuery();


           


                // Criação da tabela 'entradas'
                Command = new MySqlCommand("create table if not exists entradas " +
                    "(id integer primary key auto_increment," +
                    "idAluno int," +
                    "dataEntrada timestamp," +
                    "idEscola int," +
                    "foreign key(idAluno) references alunos(id)," +
                    "foreign key(idEscola) references escolas(id))", Connection);
                Command.ExecuteNonQuery();
            } catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error );
            }
        }
    }
}
